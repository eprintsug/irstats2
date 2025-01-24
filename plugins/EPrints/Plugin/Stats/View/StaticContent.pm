package EPrints::Plugin::Stats::View::StaticContent;

use EPrints::Plugin::Stats::View;
@ISA = ('EPrints::Plugin::Stats::View');

use strict;

# Stats::View::StaticContent
#
# Allows phrases to be embeded in the Stats grid layout.
# Phrases can contain script references/blocks, so this View can be used to do a lot - if you
# make your phrases complicated enough!
#
# Options:
# - title_phrase
# - view
# - page_phrase
# - container_class (can be used to remove box outlines)
# - title_class
# - content_class

sub can_export { return 0; }

sub has_title
{
	my( $self ) = @_;

	return defined $self->options->{title_phrase};
}

# Mostly the same as Stats::View, but with the ability to not have a border around everything
sub render
{
	my( $self ) = @_;

	my $session = $self->{session};
	my $frag = $session->make_doc_fragment;
	my $options = $self->options;

	# just re-use $self->options->{view}
	my $class_id = $self->get_id;
	$class_id =~ s/^Stats::View:://g;
	$class_id =~ s/::/_/g;

	my $classes = "irstats2_view irstats2_view_$class_id";
	$classes .= " $options->{container_class}" if defined $options->{container_class};

	if( $self->{hide_from_print} )
	{
		$classes .= " ep_noprint";
	}

	my $container = $session->make_element( 'div', class => "$classes" );
	$frag->appendChild( $container );

	if( $self->has_title() )
	{
		my $title_class = 'irstats2_view_title';
		$title_class .= " $options->{title_class}" if defined $options->{title_class};
		my $title = $session->make_element( "div", class => $title_class );

		$title->appendChild( $self->html_phrase( $options->{title_phrase} ) );

		$container->appendChild( $title );
	}

	my $content_class = "irstats2_view_content";
	$content_class .= " $options->{content_class}" if defined $options->{content_class};

	my $content = $session->make_element( "div", class => $content_class );
	$container->appendChild( $content );

	$content->appendChild( $self->render_content() );

	return $frag;
}

sub render_content
{
	my( $self ) = @_;

	my $session = $self->{session};

	my $frag = $session->make_doc_fragment;
	my $view = $self->options->{view};
	my $page = $self->options->{page_phrase};

	$frag->appendChild( $self->html_phrase( $page ) );

	return $frag;
}

# Renders the title of the View, if any.
sub render_title { shift->html_phrase( 'title' ) }

1;

