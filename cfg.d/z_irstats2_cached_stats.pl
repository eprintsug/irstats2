# Define names and associated functions for cached stats here...
# These processes are called at the end of process stats (run 
# typically on a nightly basis) and the results are stored in a file
# with the same name.
#
# These cacheable processes are designed to store data that can be
# plugged straight into a visualisation (e.g. some JSON that can be
# loaded in a world map visual), bypassing the need to make any big
# database queries that traditional IRStats2 can sometimes get caught
# up in.

$c->{irstats2}->{cacheables} = {
    "archive_count" => sub {
        my( $repo ) = @_;

        my $ds = $repo->dataset( "archive" );
        
        return $ds->count;
    }
};
